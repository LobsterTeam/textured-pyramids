/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

const vertexShader = `#version 300 es

    in  vec4 i_position;
    in  vec3 i_normal;
    in  vec2 v_tex_coord;
    
    uniform mat4 u_model_view_matrix;
    uniform mat4 u_projection_matrix;
    uniform mat4 u_normal_matrix;
    uniform vec3 u_view_world_position;
    uniform vec3 v_light_direction;
    uniform vec3 u_light_position;
    uniform float v_shininess;
    uniform float v_inner_limit;
    uniform float v_outer_limit;
    uniform float v_per_vertex_shading;
    uniform float v_spotlight_on;

    out vec4 v_color;
    out vec3 f_normal;
    out vec3 f_surface_to_light;
    out vec3 f_surface_to_view;  
    out vec3 f_light_direction;
    out vec2 f_tex_coord;
    out float f_shininess;
    out float f_inner_limit;
    out float f_outer_limit;
    out float f_per_vertex_shading;
    out float f_spotlight_on;

    void main() {
        
        f_normal = mat3(u_normal_matrix) * i_normal;
        vec3 surface_world_position = i_position.xyz;
        f_surface_to_light = u_light_position - surface_world_position;
        f_surface_to_view = u_view_world_position - surface_world_position;

        f_light_direction = v_light_direction;
        f_shininess = v_shininess;
        f_inner_limit = v_inner_limit;
        f_outer_limit = v_outer_limit;
        v_color = vec4(1.0, 1.0, 1.0, 1.0);
        
        if (v_per_vertex_shading == 1.0) {
            
            vec3 normal = normalize(f_normal);
            vec3 surface_to_light_direction = normalize(f_surface_to_light);
            vec3 surface_to_view_direction = normalize(f_surface_to_view);
            vec3 half_vector = normalize(surface_to_light_direction + surface_to_view_direction);

            float dot_from_direction = dot(surface_to_light_direction, -v_light_direction);
            float limit_range = f_inner_limit - f_outer_limit;
            float in_light = clamp((dot_from_direction - f_outer_limit) / limit_range, 0.0, 1.0);
            float light = in_light * dot(normal, surface_to_light_direction);
            float specular = in_light * pow(dot(normal, half_vector), f_shininess);

            if (v_spotlight_on == 1.0) {
                v_color.rgb *= light;
                v_color.rgb += specular;
            } else {
                v_color = vec4(0.0, 0.0, 0.0, 1.0);
            }
        }
        
        f_per_vertex_shading = v_per_vertex_shading;
        f_spotlight_on = v_spotlight_on;
        f_tex_coord = v_tex_coord;
        gl_Position = u_projection_matrix * u_model_view_matrix * i_position;
    }
`;

const fragmentShader = `#version 300 es

    precision mediump float;
    
    in vec4 v_color;
    in vec3 f_normal;
    in vec3 f_surface_to_light;
    in vec3 f_surface_to_view;
    in vec3 f_light_direction;
    in vec2 f_tex_coord;
    in float f_shininess;
    in float f_inner_limit;
    in float f_outer_limit;
    in float f_per_vertex_shading;
    in float f_spotlight_on;

    uniform sampler2D texture2d;

    out vec4 f_color;

    void main() {
        
        f_color = v_color;
  
        if (f_per_vertex_shading == 0.0) {

            vec3 normal = normalize(f_normal);
            vec3 surface_to_light_direction = normalize(f_surface_to_light);
            vec3 surface_to_view_direction = normalize(f_surface_to_view);
            vec3 half_vector = normalize(surface_to_light_direction + surface_to_view_direction);

            float dot_from_direction = dot(surface_to_light_direction, -f_light_direction);
            float limit_range = f_inner_limit - f_outer_limit;
            float in_light = clamp((dot_from_direction - f_outer_limit) / limit_range, 0.0, 1.0);
            float light = in_light * dot(normal, surface_to_light_direction);
            float specular = in_light * pow(dot(normal, half_vector), f_shininess);

            
            if (f_spotlight_on == 1.0) {
                f_color.rgb *= light;
                f_color.rgb += specular;
            } else {
                f_color = vec4(0.0, 0.0, 0.0, 1.0);
            }
        }
        
        f_color = f_color * texture(texture2d, f_tex_coord);
    }
`;

